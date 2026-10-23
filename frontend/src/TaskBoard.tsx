import { useEffect, useState } from 'react'
import type { DragEvent, FormEvent } from 'react'
import { ListTodo } from 'lucide-react'
import { apiFetch } from './api'

type Project = { id: number; name: string }
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'
type Task = {
  id: number
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  createdAt: string
}

type TaskForm = {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
}

const statuses: { value: TaskStatus; label: string }[] = [
  { value: 'TODO', label: 'To do' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'DONE', label: 'Done' },
]

const priorities: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH']
const blankForm: TaskForm = { title: '', description: '', status: 'TODO', priority: 'MEDIUM' }

export default function TaskBoard({ projects, loadingProjects = false, projectError = '', onRetryProjects, onNavigate, readOnly = false }: {
  projects: Project[]
  loadingProjects?: boolean
  projectError?: string
  onRetryProjects?: () => void
  onNavigate?: (page: 'projects') => void
  readOnly?: boolean
}) {
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const projectId = projects.some((project) => String(project.id) === selectedProjectId)
    ? selectedProjectId
    : String(projects[0]?.id ?? '')
  const [tasks, setTasks] = useState<Task[]>([])
  const [form, setForm] = useState<TaskForm>(blankForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tasksLoadError, setTasksLoadError] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const [loadedProjectId, setLoadedProjectId] = useState<string | null>(null)
  const tasksPending = loading || loadedProjectId !== projectId
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!projectId) return

    let cancelled = false
    apiFetch(`/api/tasks?projectId=${projectId}`)
      .then((response) => {
        if (!response.ok) throw new Error('Could not load tasks.')
        return response.json() as Promise<Task[]>
      })
      .then((data) => {
        if (!cancelled) {
          setTasks(data)
          setTasksLoadError('')
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setTasksLoadError(loadError instanceof Error ? loadError.message : 'Could not load tasks.')
      })
      .finally(() => {
        if (!cancelled) {
          setLoadedProjectId(projectId)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [projectId, retryKey])

  async function refreshTasks() {
    if (!projectId) return
    const response = await apiFetch(`/api/tasks?projectId=${projectId}`)
    if (!response.ok) throw new Error('Could not refresh tasks.')
    setTasks(await response.json())
  }

  async function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!projectId) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await apiFetch(editingId ? `/api/tasks/${editingId}` : '/api/tasks', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, projectId: Number(projectId) }),
      })
      if (!response.ok) throw new Error('Could not save task. Check the title and try again.')
      setForm(blankForm)
      setEditingId(null)
      setShowForm(false)
      setMessage(editingId ? 'Task updated.' : 'Task created.')
      await refreshTasks()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save task.')
    } finally {
      setSaving(false)
    }
  }

  function editTask(task: Task) {
    setEditingId(task.id)
    setForm({ title: task.title, description: task.description, status: task.status, priority: task.priority })
    setShowForm(true)
    setError('')
    setMessage('')
  }

  function closeForm() {
    setEditingId(null)
    setForm(blankForm)
    setShowForm(false)
  }

  async function moveTask(task: Task, status: TaskStatus) {
    if (readOnly || status === task.status) return
    setError('')
    try {
      const response = await apiFetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          status,
          priority: task.priority,
          projectId: Number(projectId),
        }),
      })
      if (!response.ok) throw new Error('Could not move task.')
      await refreshTasks()
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : 'Could not move task.')
    }
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return
    setError('')
    try {
      const response = await apiFetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Could not delete task.')
      setMessage('Task deleted.')
      await refreshTasks()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete task.')
    }
  }

  function dropTask(event: DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault()
    if (readOnly) return
    const taskId = Number(event.dataTransfer.getData('text/task-id'))
    const task = tasks.find((item) => item.id === taskId)
    if (task) void moveTask(task, status)
  }

  function retryTaskLoad() {
    setLoading(true)
    setTasksLoadError('')
    setRetryKey((key) => key + 1)
  }

  if (projects.length === 0) {
    return <section className="content board-onboarding">
      {loadingProjects ? <div className="workspace-empty compact" role="status">Loading projects...</div> : projectError ? <div className="workspace-empty compact"><p className="eyebrow">PROJECTS UNAVAILABLE</p><h2>Could not load your projects.</h2><p>{projectError}</p><button className="primary-button" type="button" onClick={onRetryProjects}>Retry</button></div> : <div className="workspace-empty compact"><span className="empty-icon"><ListTodo size={20} /></span><p className="eyebrow">TASK BOARD</p><h2>A board needs a project.</h2><p>Create a project first, then its work can flow through each stage here.</p>{!readOnly ? <button className="primary-button" type="button" onClick={() => onNavigate?.('projects')}>Create a project <span aria-hidden="true">→</span></button> : null}</div>}
    </section>
  }

  return (
    <section className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">PROJECT WORK</p>
          <h1>Task board</h1>
          <p className="subheading">Move work from idea to done.</p>
        </div>
        <div className="board-controls">
          <label className="sr-only" htmlFor="board-project">Choose project</label>
          <select id="board-project" value={projectId} onChange={(event) => { setSelectedProjectId(event.target.value); setError('') }}>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          {!readOnly ? <button className="primary-button board-add" type="button" onClick={() => { setEditingId(null); setForm(blankForm); setShowForm(true) }}>+ Add task</button> : null}
        </div>
      </div>

      {showForm ? (
        <form className="task-form" onSubmit={(event) => void submitTask(event)}>
          <div className="task-form-heading"><h2>{editingId ? 'Edit task' : 'New task'}</h2><button className="cancel-button" type="button" onClick={closeForm}>Cancel</button></div>
          <div className="task-field"><label htmlFor="task-title">Title</label><input id="task-title" required maxLength={160} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Sketch the project dashboard" /></div>
          <div className="task-field"><label htmlFor="task-description">Description <span>Optional</span></label><textarea id="task-description" rows={3} maxLength={1000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Add a few details" /></div>
          <div className="task-form-options">
            <div><label htmlFor="task-status">Status</label><select id="task-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as TaskStatus })}>{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></div>
            <div><label htmlFor="task-priority">Priority</label><select id="task-priority" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as TaskPriority })}>{priorities.map((priority) => <option key={priority} value={priority}>{priority[0] + priority.slice(1).toLowerCase()}</option>)}</select></div>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Create task'}</button>
          </div>
        </form>
      ) : null}

      {message ? <p className="feedback success" role="status">{message}</p> : null}
      {error ? <p className="feedback error" role="alert">{error}</p> : null}
      {tasksPending ? <p className="state-message">Loading tasks...</p> : null}
      {!tasksPending && tasksLoadError ? <div className="board-load-error" role="alert"><span>{tasksLoadError}</span><button type="button" onClick={retryTaskLoad}>Retry</button></div> : null}

      {!tasksPending && !tasksLoadError ? <div className="board-columns kanban-grid">
        {statuses.map((status) => {
          const columnTasks = tasks.filter((task) => task.status === status.value)
          return (
            <section className="board-column" key={status.value} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropTask(event, status.value)} aria-label={status.label}>
              <div className="column-heading"><h2>{status.label}</h2><span>{columnTasks.length}</span></div>
              <div className="task-stack">
                {columnTasks.map((task) => (
                  <article className="task-card" key={task.id} draggable={!readOnly} onDragStart={(event) => event.dataTransfer.setData('text/task-id', String(task.id))}>
                    <div className="task-card-top"><span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span>{!readOnly ? <button className="icon-action" type="button" aria-label={`Delete ${task.title}`} title="Delete task" onClick={() => void deleteTask(task)}>×</button> : null}</div>
                    <h3>{task.title}</h3>
                    {task.description ? <p>{task.description}</p> : null}
                    <div className="task-card-bottom">
                      {readOnly ? <span className="task-readonly-status">{status.label}</span> : <select aria-label={`Move ${task.title}`} value={task.status} onChange={(event) => void moveTask(task, event.target.value as TaskStatus)}>{statuses.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}
                      {!readOnly ? <button className="text-button" type="button" onClick={() => editTask(task)}>Edit</button> : null}
                    </div>
                  </article>
                ))}
                {columnTasks.length === 0 ? <p className="column-empty">No tasks</p> : null}
              </div>
            </section>
          )
        })}
      </div> : null}
    </section>
  )
}

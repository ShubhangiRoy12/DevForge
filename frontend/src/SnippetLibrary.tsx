import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Editor from '@monaco-editor/react'
import { FileCode2 } from 'lucide-react'
import { apiFetch } from './api'

type Snippet = {
  id: number
  title: string
  language: string
  description: string
  code: string
  shared: boolean
  shareId: string | null
  updatedAt: string
}

type SnippetForm = Pick<Snippet, 'title' | 'language' | 'description' | 'code'>

const languages = [
  ['javascript', 'JavaScript'], ['typescript', 'TypeScript'], ['java', 'Java'],
  ['python', 'Python'], ['json', 'JSON'], ['html', 'HTML'], ['css', 'CSS'],
  ['sql', 'SQL'], ['shell', 'Shell'], ['markdown', 'Markdown'], ['plaintext', 'Plain text'],
]

const blankForm: SnippetForm = { title: '', language: 'javascript', description: '', code: '' }

export default function SnippetLibrary({ readOnly = false }: { readOnly?: boolean }) {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState<SnippetForm>(blankForm)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [shareToken, setShareToken] = useState(() => new URLSearchParams(window.location.search).get('share'))
  const [sharedSnippet, setSharedSnippet] = useState<Snippet | null>(null)
  const selectedSnippet = snippets.find((snippet) => snippet.id === selectedId) ?? null
  const activeSnippet = selectedSnippet ?? (readOnly && !shareToken ? snippets[0] ?? null : null)
  const editorForm = readOnly && !selectedSnippet && activeSnippet
    ? { title: activeSnippet.title, language: activeSnippet.language, description: activeSnippet.description, code: activeSnippet.code }
    : form

  useEffect(() => {
    if (shareToken) {
      let cancelled = false
      apiFetch(`/api/snippets/shared/${shareToken}`)
        .then((response) => {
          if (!response.ok) throw new Error('This share link is invalid or has been turned off.')
          return response.json() as Promise<Snippet>
        })
        .then((snippet) => { if (!cancelled) setSharedSnippet(snippet) })
        .catch((sharedLoadError: unknown) => { if (!cancelled) setError(sharedLoadError instanceof Error ? sharedLoadError.message : 'Could not load shared snippet.') })
        .finally(() => { if (!cancelled) setLoading(false) })
      return () => { cancelled = true }
    }

    let cancelled = false
    const timer = window.setTimeout(() => {
      apiFetch(`/api/snippets?query=${encodeURIComponent(query)}`)
        .then((response) => {
          if (!response.ok) throw new Error('Could not load snippets.')
          return response.json() as Promise<Snippet[]>
        })
        .then((data) => { if (!cancelled) { setSnippets(data); setLoadError('') } })
        .catch(() => { if (!cancelled) setLoadError('Snippets could not be loaded.') })
        .finally(() => { if (!cancelled) setLoading(false) })
    }, 180)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, shareToken, retryKey])

  function chooseSnippet(snippet: Snippet) {
    setSelectedId(snippet.id)
    setForm({ title: snippet.title, language: snippet.language, description: snippet.description, code: snippet.code })
    setError('')
    setMessage('')
  }

  function startNew() {
    setSelectedId(null)
    setForm(blankForm)
    setError('')
    setMessage('')
  }

  async function refreshSnippets() {
    const response = await apiFetch(`/api/snippets?query=${encodeURIComponent(query)}`)
    if (!response.ok) throw new Error('Could not refresh snippets.')
    const data: Snippet[] = await response.json()
    setSnippets(data)
    return data
  }

  async function saveSnippet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await apiFetch(selectedId ? `/api/snippets/${selectedId}` : '/api/snippets', {
        method: selectedId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!response.ok) throw new Error('Could not save snippet. Check the title and code.')
      const saved: Snippet = await response.json()
      setSelectedId(saved.id)
      setMessage(selectedId ? 'Snippet updated.' : 'Snippet saved.')
      await refreshSnippets()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save snippet.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSnippet() {
    if (!selectedSnippet || !window.confirm(`Delete "${selectedSnippet.title}"? This cannot be undone.`)) return
    setError('')
    try {
      const response = await apiFetch(`/api/snippets/${selectedSnippet.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Could not delete snippet.')
      startNew()
      setMessage('Snippet deleted.')
      await refreshSnippets()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete snippet.')
    }
  }

  async function copyText(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text)
      setMessage(successMessage)
      setError('')
    } catch {
      setError('Clipboard access was blocked by the browser. Select and copy the text instead.')
    }
  }

  async function toggleSharing() {
    if (!selectedSnippet) return
    setError('')
    try {
      const response = await apiFetch(`/api/snippets/${selectedSnippet.id}/share`, {
        method: selectedSnippet.shared ? 'DELETE' : 'POST',
      })
      if (!response.ok) throw new Error('Could not update the share link.')
      const updated = selectedSnippet.shared ? null : await response.json() as Snippet
      setSnippets((current) => current.map((item) => item.id === selectedSnippet.id && updated ? updated : item))
      if (updated) {
        const url = `${window.location.origin}${window.location.pathname}?share=${updated.shareId}`
        await copyText(url, 'Share link enabled and copied.')
      } else {
        setMessage('Share link turned off.')
        setError('')
      }
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : 'Could not update the share link.')
    }
  }

  function leaveSharedView() {
    window.history.replaceState({}, '', window.location.pathname)
    setLoading(true)
    setShareToken(null)
    setSharedSnippet(null)
    setError('')
  }

  if (shareToken) {
    return (
      <section className="content shared-view">
        <div className="page-heading"><div><p className="eyebrow">SHARED CODE</p><h1>{sharedSnippet?.title ?? 'Shared snippet'}</h1><p className="subheading">{sharedSnippet ? `${sharedSnippet.language} · ${sharedSnippet.description || 'Reusable code snippet'}` : 'Loading shared snippet...'}</p></div><button className="text-button" type="button" onClick={leaveSharedView}>Back to snippets</button></div>
        {error ? <p className="feedback error" role="alert">{error}</p> : null}
        {sharedSnippet ? <><div className="shared-code"><Editor height="min(65vh, 640px)" language={sharedSnippet.language} value={sharedSnippet.code} theme="vs-dark" options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, automaticLayout: true, scrollBeyondLastLine: false }} /></div><button className="primary-button" type="button" onClick={() => void copyText(sharedSnippet.code, 'Code copied.')}>Copy code</button></> : null}
      </section>
    )
  }

  return (
    <section className="content snippet-content">
      <div className="page-heading">
        <div><p className="eyebrow">REUSABLE CODE</p><h1>Snippets</h1><p className="subheading">Save useful code and find it again quickly.</p></div>
        {!readOnly ? <button className="primary-button snippet-new" type="button" onClick={startNew}>+ New snippet</button> : null}
      </div>

      <div className="snippet-layout">
        <aside className="snippet-list" aria-label="Saved snippets">
          <label className="sr-only" htmlFor="snippet-search">Search snippets</label>
          <input id="snippet-search" className="snippet-search" type="search" value={query} onChange={(event) => { setLoading(true); setLoadError(''); setQuery(event.target.value); setError('') }} placeholder="Search snippets" />
          <div className="snippet-list-heading">{loading ? 'Loading...' : loadError ? 'Unavailable' : `${snippets.length} snippet${snippets.length === 1 ? '' : 's'}`}</div>
          {loadError ? <div className="explorer-error" role="alert"><span>{loadError}</span><button type="button" onClick={() => { setLoading(true); setLoadError(''); setRetryKey((key) => key + 1) }}>Retry</button></div> : null}
          {snippets.map((snippet) => <button className={`snippet-list-item ${snippet.id === (selectedId ?? (readOnly ? snippets[0]?.id : null)) ? 'selected' : ''}`} type="button" key={snippet.id} onClick={() => chooseSnippet(snippet)}><span className="snippet-list-title">{snippet.title}</span><span className="snippet-list-meta">{snippet.language}{snippet.shared ? ' · shared' : ''}</span></button>)}
          {!loading && !loadError && snippets.length === 0 ? <p className="snippet-empty">{query ? 'No snippets match this search.' : 'No snippets saved yet.'}</p> : null}
        </aside>

        <div className="snippet-editor-pane">
          {loadError ? <div className="workspace-empty compact" role="status"><span className="empty-icon"><FileCode2 size={18} /></span><h2>Editor unavailable</h2><p>Saved snippets could not be loaded, so the editor is paused rather than showing an empty draft.</p><button className="primary-button" type="button" onClick={() => { setLoading(true); setLoadError(''); setRetryKey((key) => key + 1) }}>Retry</button></div> : <form onSubmit={(event) => void saveSnippet(event)}>
            <div className="snippet-form-top">
              <div className="snippet-fields">
                <label htmlFor="snippet-title">Title</label>
                <input id="snippet-title" maxLength={160} required readOnly={readOnly} value={editorForm.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Fetch JSON with error handling" />
                <label htmlFor="snippet-description">Description <span>Optional</span></label>
                <input id="snippet-description" maxLength={1000} readOnly={readOnly} value={editorForm.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What does this snippet do?" />
              </div>
              <div className="snippet-language"><label htmlFor="snippet-language">Language</label><select id="snippet-language" disabled={readOnly} value={editorForm.language} onChange={(event) => setForm({ ...form, language: event.target.value })}>{languages.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            </div>
            <div className="ide-editor-bar"><div className="ide-file-tab"><FileCode2 size={14} /><span>{editorForm.title || 'Untitled snippet'}</span><code>{editorForm.language}</code></div><span className="ide-context">SNIPPETS <i>/</i> EDITOR</span></div>
            <div className="editor-label"><label>Code</label><span>Ctrl + F searches in the editor</span></div>
            <div className="monaco-shell"><Editor height="380px" language={editorForm.language} value={editorForm.code} onChange={(value) => setForm({ ...form, code: value ?? '' })} theme="vs-dark" options={{ readOnly, minimap: { enabled: false }, fontSize: 13, automaticLayout: true, scrollBeyondLastLine: false, tabSize: 2, wordWrap: 'on' }} /></div>
            <div className="snippet-actions">
              {!readOnly ? <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : selectedId ? 'Save changes' : 'Save snippet'}</button> : null}
              {activeSnippet ? <button className="text-button" type="button" onClick={() => void copyText(activeSnippet.code, 'Code copied.')}>Copy code</button> : null}
              {activeSnippet && !readOnly ? <button className="text-button" type="button" onClick={() => void toggleSharing()}>{activeSnippet.shared ? 'Turn off sharing' : 'Create share link'}</button> : null}
              {activeSnippet?.shared && activeSnippet.shareId ? <button className="text-button" type="button" onClick={() => void copyText(`${window.location.origin}${window.location.pathname}?share=${activeSnippet.shareId}`, 'Share link copied.')}>Copy link</button> : null}
              {activeSnippet && !readOnly ? <button className="text-button danger" type="button" onClick={() => void deleteSnippet()}>Delete</button> : null}
            </div>
          </form>}
          {message ? <p className="feedback success" role="status">{message}</p> : null}
          {error ? <p className="feedback error" role="alert">{error}</p> : null}
        </div>
      </div>
    </section>
  )
}

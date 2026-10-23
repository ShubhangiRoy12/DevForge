import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Editor from '@monaco-editor/react'
import { FileCode2, FolderOpen } from 'lucide-react'
import { apiFetch } from './api'

type Collection = { id: number; name: string; description: string }
type SourceFile = { id: number; name: string; language: string; content: string; updatedAt: string }
type FileForm = Pick<SourceFile, 'name' | 'language' | 'content'>
type CollectionForm = Pick<Collection, 'name' | 'description'>

const languageOptions = [
  ['java', 'Java'], ['javascript', 'JavaScript'], ['typescript', 'TypeScript'],
  ['python', 'Python'], ['json', 'JSON'], ['html', 'HTML'], ['css', 'CSS'],
  ['sql', 'SQL'], ['shell', 'Shell'], ['markdown', 'Markdown'], ['plaintext', 'Plain text'],
]

const blankFile: FileForm = { name: 'Main.java', language: 'java', content: '' }
const blankCollection: CollectionForm = { name: '', description: '' }

export default function SourceFiles({ readOnly = false }: { readOnly?: boolean }) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [collectionChoice, setCollectionChoice] = useState<number | null>(null)
  const selectedCollectionId = collections.some((collection) => collection.id === collectionChoice)
    ? collectionChoice
    : collections[0]?.id ?? null
  const selectedCollection = collections.find((collection) => collection.id === selectedCollectionId) ?? null
  const [files, setFiles] = useState<SourceFile[]>([])
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null)
  const selectedFileIdRef = useRef<number | null>(null)
  const selectedFile = files.find((file) => file.id === selectedFileId) ?? null
  const [fileForm, setFileForm] = useState<FileForm>(blankFile)
  const [collectionForm, setCollectionForm] = useState<CollectionForm>(blankCollection)
  const [editingCollectionId, setEditingCollectionId] = useState<number | null>(null)
  const [showCollectionForm, setShowCollectionForm] = useState(false)
  const [creatingFile, setCreatingFile] = useState(false)
  const creatingFileRef = useRef(false)
  const [fileQuery, setFileQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [collectionsLoadError, setCollectionsLoadError] = useState('')
  const [filesLoading, setFilesLoading] = useState(false)
  const [filesLoadError, setFilesLoadError] = useState('')
  const [loadedFilesCollection, setLoadedFilesCollection] = useState<number | null>(null)
  const [retryCollections, setRetryCollections] = useState(0)
  const [retryFiles, setRetryFiles] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const visibleFiles = files.filter((file) => file.name.toLowerCase().includes(fileQuery.toLowerCase()))
  const filesPending = filesLoading || (selectedCollectionId !== null && loadedFilesCollection !== selectedCollectionId)

  useEffect(() => {
    let cancelled = false
    apiFetch('/api/collections')
      .then((response) => {
        if (!response.ok) throw new Error('Could not load collections.')
        return response.json() as Promise<Collection[]>
      })
      .then((data) => { if (!cancelled) { setCollections(data); setCollectionsLoadError('') } })
      .catch(() => { if (!cancelled) setCollectionsLoadError('Collections could not be loaded.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [retryCollections])

  useEffect(() => {
    if (selectedCollectionId === null) return
    let cancelled = false
    apiFetch(`/api/collections/${selectedCollectionId}/files`)
      .then((response) => {
        if (!response.ok) throw new Error('Could not load files in this collection.')
        return response.json() as Promise<SourceFile[]>
      })
      .then((data) => {
        if (!cancelled) {
          setFiles(data)
          setFilesLoadError('')
          const nextFile = data.find((file) => file.id === selectedFileIdRef.current) ?? data[0] ?? null
          selectedFileIdRef.current = nextFile?.id ?? null
          setSelectedFileId(nextFile?.id ?? null)
          if (nextFile && !creatingFileRef.current) {
            setFileForm({ name: nextFile.name, language: nextFile.language, content: nextFile.content })
          }
        }
      })
      .catch(() => { if (!cancelled) setFilesLoadError('Files in this collection could not be loaded.') })
      .finally(() => { if (!cancelled) { setLoadedFilesCollection(selectedCollectionId); setFilesLoading(false) } })
    return () => { cancelled = true }
  }, [selectedCollectionId, retryFiles])

  async function refreshCollections() {
    const response = await apiFetch('/api/collections')
    if (!response.ok) throw new Error('Could not refresh collections.')
    const data: Collection[] = await response.json()
    setCollections(data)
    return data
  }

  async function refreshFiles(collectionId: number) {
    const response = await apiFetch(`/api/collections/${collectionId}/files`)
    if (!response.ok) throw new Error('Could not refresh files.')
    const data: SourceFile[] = await response.json()
    setFiles(data)
    return data
  }

  function startCollectionEdit(collection: Collection) {
    setEditingCollectionId(collection.id)
    setCollectionForm({ name: collection.name, description: collection.description })
    setShowCollectionForm(true)
    setError('')
  }

  function startCollectionCreate() {
    setEditingCollectionId(null)
    setCollectionForm(blankCollection)
    setShowCollectionForm(true)
    setError('')
  }

  async function saveCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await apiFetch(editingCollectionId ? `/api/collections/${editingCollectionId}` : '/api/collections', {
        method: editingCollectionId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collectionForm),
      })
      if (!response.ok) throw new Error('Could not save collection.')
      const saved: Collection = await response.json()
      setCollectionChoice(saved.id)
      setShowCollectionForm(false)
      setEditingCollectionId(null)
      setMessage(editingCollectionId ? 'Collection updated.' : 'Collection created.')
      await refreshCollections()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save collection.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteCollection(collection: Collection) {
    if (!window.confirm(`Delete "${collection.name}" and all its files? This cannot be undone.`)) return
    setError('')
    try {
      const response = await apiFetch(`/api/collections/${collection.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Could not delete collection.')
      setCollectionChoice(null)
      setSelectedFileId(null)
      selectedFileIdRef.current = null
      setFiles([])
      setMessage('Collection and its files deleted.')
      await refreshCollections()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete collection.')
    }
  }

  function startFileCreate() {
    setCreatingFile(true)
    creatingFileRef.current = true
    setSelectedFileId(null)
    selectedFileIdRef.current = null
    setFileForm(blankFile)
    setError('')
    setMessage('')
  }

  function chooseFile(file: SourceFile) {
    setCreatingFile(false)
    creatingFileRef.current = false
    setSelectedFileId(file.id)
    selectedFileIdRef.current = file.id
    setFileForm({ name: file.name, language: file.language, content: file.content })
    setError('')
    setMessage('')
  }

  async function saveFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (selectedCollectionId === null) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await apiFetch(creatingFile ? `/api/collections/${selectedCollectionId}/files` : `/api/source-files/${selectedFileId}`, {
        method: creatingFile ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileForm),
      })
      if (!response.ok) throw new Error('Could not save file. Check its name and content.')
      const saved: SourceFile = await response.json()
      setCreatingFile(false)
      creatingFileRef.current = false
      setSelectedFileId(saved.id)
      selectedFileIdRef.current = saved.id
      setMessage(creatingFile ? 'File added to collection.' : 'File saved.')
      await refreshFiles(selectedCollectionId)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save file.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteFile() {
    if (!selectedFile || !window.confirm(`Delete "${selectedFile.name}"? This cannot be undone.`)) return
    setError('')
    try {
      const response = await apiFetch(`/api/source-files/${selectedFile.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Could not delete file.')
      setSelectedFileId(null)
      selectedFileIdRef.current = null
      setCreatingFile(false)
      creatingFileRef.current = false
      setFileForm(blankFile)
      setMessage('File deleted.')
      if (selectedCollectionId !== null) {
        const remaining = await refreshFiles(selectedCollectionId)
        const nextFile = remaining[0] ?? null
        setSelectedFileId(nextFile?.id ?? null)
        selectedFileIdRef.current = nextFile?.id ?? null
        setFileForm(nextFile ? { name: nextFile.name, language: nextFile.language, content: nextFile.content } : blankFile)
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete file.')
    }
  }

  async function copyFile() {
    try {
      await navigator.clipboard.writeText(fileForm.content)
      setMessage('File content copied.')
    } catch {
      setError('Clipboard access was blocked by the browser.')
    }
  }

  return (
    <section className="content source-content">
      <div className="page-heading">
        <div><p className="eyebrow">SMALL TEXT FILES</p><h1>Source files</h1><p className="subheading">Keep related code and notes together.</p></div>
        {!readOnly ? <button className="primary-button source-add-collection" type="button" onClick={startCollectionCreate}>+ New collection</button> : null}
      </div>

      {error ? <p className="feedback error" role="alert">{error}</p> : null}
      {message ? <p className="feedback success" role="status">{message}</p> : null}

      <div className="source-layout">
        <aside className="source-browser" aria-label="Collections and files">
          <div className="source-browser-heading"><h2>Collections</h2><span>{loading ? '...' : collectionsLoadError ? 'Unavailable' : collections.length}</span></div>
          {collectionsLoadError ? <div className="explorer-error" role="alert"><span>{collectionsLoadError}</span><button type="button" onClick={() => { setLoading(true); setCollectionsLoadError(''); setRetryCollections((key) => key + 1) }}>Retry</button></div> : null}
          {collections.map((collection) => (
            <div className={`collection-row ${collection.id === selectedCollectionId ? 'selected' : ''}`} key={collection.id}>
              <button type="button" className="collection-select" onClick={() => { if (selectedCollectionId === collection.id) return; setFilesLoading(true); setFilesLoadError(''); setLoadedFilesCollection(null); setFiles([]); setSelectedFileId(null); selectedFileIdRef.current = null; setCollectionChoice(collection.id); setCreatingFile(false); creatingFileRef.current = false; setError('') }}><span className="folder-mark">▸</span><span>{collection.name}</span></button>
              {!readOnly ? <button className="icon-action" type="button" title="Edit collection" aria-label={`Edit ${collection.name}`} onClick={() => startCollectionEdit(collection)}>✎</button> : null}
              {!readOnly ? <button className="icon-action" type="button" title="Delete collection" aria-label={`Delete ${collection.name}`} onClick={() => void deleteCollection(collection)}>×</button> : null}
            </div>
          ))}
          {loading && collections.length === 0 ? <p className="source-empty">Loading collections...</p> : null}
          {!loading && !collectionsLoadError && collections.length === 0 ? <p className="source-empty">{readOnly ? 'No sample collections yet.' : 'Create a collection to get started.'}</p> : null}

          {selectedCollection ? <div className="file-browser">
            <div className="source-browser-heading"><h2>Files</h2>{!readOnly ? <button className="text-button" type="button" onClick={startFileCreate}>+ New file</button> : null}</div>
            <input className="snippet-search" aria-label="Filter files" type="search" value={fileQuery} onChange={(event) => setFileQuery(event.target.value)} placeholder="Filter files" />
            {visibleFiles.map((file) => <button className={`file-list-item ${file.id === selectedFileId && !creatingFile ? 'selected' : ''}`} type="button" key={file.id} onClick={() => chooseFile(file)}><span>{file.name}</span><small>{file.language}</small></button>)}
            {filesLoadError ? <div className="explorer-error" role="alert"><span>{filesLoadError}</span><button type="button" onClick={() => { setFilesLoading(true); setFilesLoadError(''); setRetryFiles((key) => key + 1) }}>Retry</button></div> : null}
            {filesPending ? <p className="source-empty">Loading files...</p> : null}
            {!filesPending && !filesLoadError && !visibleFiles.length ? <p className="source-empty">{fileQuery ? 'No matching files.' : 'No files yet.'}</p> : null}
          </div> : null}
        </aside>

        <div className="source-workspace">
          {showCollectionForm ? <form className="collection-form" onSubmit={(event) => void saveCollection(event)}>
            <h2>{editingCollectionId ? 'Edit collection' : 'New collection'}</h2>
            <label htmlFor="collection-name">Name</label><input id="collection-name" required maxLength={120} value={collectionForm.name} onChange={(event) => setCollectionForm({ ...collectionForm, name: event.target.value })} placeholder="e.g. Java DSA" />
            <label htmlFor="collection-description">Description <span>Optional</span></label><input id="collection-description" maxLength={1000} value={collectionForm.description} onChange={(event) => setCollectionForm({ ...collectionForm, description: event.target.value })} placeholder="What belongs here?" />
            <div className="source-form-actions"><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editingCollectionId ? 'Save changes' : 'Create collection'}</button><button className="cancel-button" type="button" onClick={() => setShowCollectionForm(false)}>Cancel</button></div>
          </form> : null}

          {!showCollectionForm && selectedCollection ? <>
            <div className="source-workspace-heading"><div><p className="eyebrow">{selectedCollection.description || 'COLLECTION'}</p><h2>{selectedCollection.name}</h2></div>{creatingFile ? <button className="cancel-button" type="button" onClick={() => { setCreatingFile(false); creatingFileRef.current = false; setSelectedFileId(null); selectedFileIdRef.current = null }}>{'Cancel new file'}</button> : null}</div>
            {creatingFile || selectedFile ? <form className="source-file-form" onSubmit={(event) => void saveFile(event)}>
              <div className="source-file-fields"><div><label htmlFor="source-file-name">File name</label><input id="source-file-name" required maxLength={160} readOnly={readOnly} value={fileForm.name} onChange={(event) => setFileForm({ ...fileForm, name: event.target.value })} placeholder="Example.java" /></div><div><label htmlFor="source-file-language">Language</label><select id="source-file-language" disabled={readOnly} value={fileForm.language} onChange={(event) => setFileForm({ ...fileForm, language: event.target.value })}>{languageOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div>
              <div className="ide-editor-bar"><div className="ide-file-tab"><FileCode2 size={14} /><span>{fileForm.name}</span><code>{fileForm.language}</code></div><span className="ide-context"><FolderOpen size={13} /> {selectedCollection.name}</span></div>
              <div className="editor-label"><label>File contents</label><span>{creatingFile ? 'New file · not saved yet' : 'Saved in this collection'}</span></div>
              <div className="monaco-shell"><Editor height="min(58vh, 600px)" language={fileForm.language} value={fileForm.content} onChange={(value) => setFileForm({ ...fileForm, content: value ?? '' })} theme="vs-dark" options={{ readOnly, minimap: { enabled: false }, fontSize: 13, automaticLayout: true, scrollBeyondLastLine: false, tabSize: 2, wordWrap: 'on' }} /></div>
              <div className="source-form-actions">{!readOnly ? <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : creatingFile ? 'Add file' : 'Save file'}</button> : null}{!creatingFile ? <><button className="text-button" type="button" onClick={() => void copyFile()}>Copy contents</button>{!readOnly ? <button className="text-button danger" type="button" onClick={() => void deleteFile()}>Delete file</button> : null}</> : null}</div>
            </form> : filesPending ? <div className="empty-state source-prompt"><div className="empty-icon"><FileCode2 size={18} /></div><h3>Loading files...</h3><p>The collection contents are loading.</p></div> : filesLoadError ? <div className="empty-state source-prompt"><div className="empty-icon"><FileCode2 size={18} /></div><h3>Files unavailable</h3><p>Retry the request to view this collection’s files.</p><button className="primary-button" type="button" onClick={() => { setFilesLoading(true); setFilesLoadError(''); setRetryFiles((key) => key + 1) }}>Retry</button></div> : <div className="empty-state source-prompt"><div className="empty-icon"><FileCode2 size={18} /></div><h3>{files.length ? 'Choose a file' : 'No files in this collection'}</h3><p>Select a file or add one to this collection.</p></div>}
          </> : null}

          {!showCollectionForm && !selectedCollection ? <div className="empty-state source-prompt">
            <div className="empty-icon"><FolderOpen size={18} /></div>
            <h3>{loading ? 'Loading collections...' : collectionsLoadError ? 'Collections unavailable' : 'No collection selected'}</h3>
            <p>{loading ? 'Your source workspace is loading.' : collectionsLoadError ? 'Retry the request to load your saved collections.' : readOnly ? 'This demo has no sample collections.' : 'Create a collection to organize your source files.'}</p>
            {collectionsLoadError ? <button className="primary-button" type="button" onClick={() => setRetryCollections((key) => key + 1)}>Retry</button> : null}
            {!loading && !collectionsLoadError && !readOnly ? <button className="primary-button" type="button" onClick={startCollectionCreate}>Create collection</button> : null}
          </div> : null}
        </div>
      </div>
    </section>
  )
}

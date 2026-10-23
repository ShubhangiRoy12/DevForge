import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Code2, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import DevForgeLogo from './DevForgeLogo'
import { apiFetch } from './api'
import './auth.css'

export type Account = { email: string; displayName: string }

export default function AuthPage({ mode, onModeChange, onSuccess, onBack }: {
  mode: 'login' | 'signup'
  onModeChange: (mode: 'login' | 'signup') => void
  onSuccess: (account: Account) => void
  onBack: () => void
}) {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await apiFetch(`/api/auth/${mode === 'signup' ? 'signup' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...(mode === 'signup' ? { displayName } : {}) }),
      })
      if (!response.ok) {
        const detail = await response.text()
        throw new Error(detail.includes('already exists') ? 'An account with this email already exists.' : mode === 'login' ? 'Email or password is incorrect.' : 'Could not create your account. Check your details and try again.')
      }
      onSuccess(await response.json() as Account)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not connect. Check that the DevForge API is running.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-backdrop" aria-hidden="true" />
      <header className="auth-topbar">
        <button className="auth-back" type="button" onClick={onBack} aria-label="Back to DevForge"><ArrowLeft size={17} /></button>
        <a href="#top" aria-label="DevForge home"><DevForgeLogo /></a>
        <span className="auth-top-note"><ShieldCheck size={14} /> PRIVATE WORKSPACE</span>
      </header>
      <section className="auth-layout" id="top">
        <div className="auth-intro">
          <p className="auth-eyebrow"><Code2 size={15} /> YOUR WORK, IN ONE PLACE</p>
          <h1>{mode === 'signup' ? <>Make room<br />for what’s next.</> : <>Pick up<br />where you left off.</>}</h1>
          <p className="auth-intro-copy">Projects, tasks, reusable code and working files, kept together in your own developer workspace.</p>
          <div className="auth-assurance"><span className="auth-assurance-mark"><ShieldCheck size={17} /></span><span><strong>Your workspace is private</strong><small>Your account can only access its own projects and code.</small></span></div>
        </div>
        <section className="auth-panel" aria-labelledby="auth-title">
          <div className="auth-panel-heading"><p className="auth-eyebrow">DEVFORGE ACCOUNT</p><h2 id="auth-title">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2><p>{mode === 'signup' ? 'Start with a private workspace of your own.' : 'Sign in to continue to your workspace.'}</p></div>
          <form onSubmit={(event) => void submit(event)}>
            {mode === 'signup' ? <label htmlFor="auth-name">Name<input id="auth-name" name="name" autoComplete="name" maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" /></label> : null}
            <label htmlFor="auth-email">Email address<input id="auth-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
            <label htmlFor="auth-password">Password<div className="auth-password-wrap"><input id="auth-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={10} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 10 characters" /><button type="button" className="auth-password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            {error ? <p className="auth-error" role="alert">{error}</p> : null}
            <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}<ArrowRight size={16} /></button>
          </form>
          <p className="auth-switch">{mode === 'signup' ? 'Already have an account?' : 'New to DevForge?'} <button type="button" onClick={() => { setError(''); onModeChange(mode === 'signup' ? 'login' : 'signup') }}>{mode === 'signup' ? 'Sign in' : 'Create an account'}</button></p>
          <p className="auth-fineprint">By continuing, your workspace data stays associated with this account.</p>
        </section>
      </section>
    </main>
  )
}

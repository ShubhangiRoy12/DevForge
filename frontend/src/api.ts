const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

export const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'

let csrfToken: string | null = null

export async function apiFetch(path: string, init: RequestInit = {}) {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    if (!csrfToken) {
      const response = await fetch(`${apiBaseUrl}/api/auth/csrf`, { credentials: 'include' })
      if (response.ok) csrfToken = (await response.json() as { token: string }).token
    }
    if (csrfToken) headers.set('X-XSRF-TOKEN', csrfToken)
  }
  return fetch(`${apiBaseUrl}${path}`, { ...init, headers, credentials: 'include' })
}

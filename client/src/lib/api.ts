// client/src/lib/api.ts
const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

/** Keep auth in-memory for fast access */
let _authToken: string | null =
  typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

/** Optional: run something on 401 (e.g., logout + redirect) */
let _onUnauthorized: (() => void) | null = null

export function setAuthToken(token: string | null) {
  _authToken = token
  if (typeof window !== 'undefined') {
    if (token) localStorage.setItem('auth_token', token)
    else localStorage.removeItem('auth_token')
  }
}

export function getAuthToken() {
  return _authToken
}

export function onUnauthorized(cb: (() => void) | null) {
  _onUnauthorized = cb
}

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  isFormData?: boolean
  signal?: AbortSignal
}

async function request<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${API}${path}`
  const headers: Record<string, string> = { ...(opts.headers || {}) }

  // JSON by default (unless uploading FormData)
  if (!opts.isFormData) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  }

  // Attach auth if present
  const token = getAuthToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(url, {
      method: opts.method || 'GET',
      headers,
      body: opts.isFormData
        ? (opts.body as FormData)
        : opts.body !== undefined
        ? JSON.stringify(opts.body)
        : undefined,
      signal: opts.signal,
    })
  } catch (err: any) {
    // Surface network/CORS errors clearly
    const msg =
      err?.name === 'AbortError'
        ? 'Request cancelled'
        : 'Network error: failed to reach API'
    throw new Error(msg)
  }

  if (res.status === 401) {
    _onUnauthorized?.()
  }

  if (!res.ok) {
    // Try to read server error payload
    let message = ''
    const text = await res.text()
    try {
      const parsed = JSON.parse(text)
      message = parsed.error || parsed.message || text
    } catch {
      message = text || `Request failed with ${res.status}`
    }
    throw new Error(message)
  }

  // No content
  if (res.status === 204) return undefined as unknown as T

  return res.json() as Promise<T>
}

export function getJSON<T>(path: string) {
  return request<T>(path, { method: 'GET' })
}

export function postJSON<T>(path: string, body: any) {
  return request<T>(path, { method: 'POST', body })
}

export function putJSON<T>(path: string, body: any) {
  return request<T>(path, { method: 'PUT', body })
}

export function delJSON<T>(path: string) {
  return request<T>(path, { method: 'DELETE' })
}

export async function uploadFile<T>(path: string, file: File) {
  const fd = new FormData()
  fd.append('file', file)
  return request<T>(path, { method: 'POST', body: fd, isFormData: true })
}

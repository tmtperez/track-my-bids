// client/src/lib/api.ts

// Base URL: prefer env, else assume your server on 4000
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000/api'

/** Normalize to a proper URL. If path already looks absolute, return it. */
function toUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path
  // ensure exactly one slash between base and path
  const base = API_BASE.replace(/\/+$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

/** In-memory cache of the token (fast access) */
let _authToken: string | null =
  typeof window !== 'undefined'
    ? // read from any of these keys (first match wins)
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('access_token') ||
      null
    : null

/** Optional: run something on 401 (e.g., logout + redirect) */
let _onUnauthorized: (() => void) | null = null

export function setAuthToken(token: string | null) {
  _authToken = token
  if (typeof window !== 'undefined') {
    if (token) {
      // write back to a single canonical key
      localStorage.setItem('auth_token', token)
      // clean up legacy keys so we don’t get confused later
      localStorage.removeItem('token')
      localStorage.removeItem('jwt')
      localStorage.removeItem('access_token')
    } else {
      localStorage.removeItem('auth_token')
    }
  }
}

export function getAuthToken() {
  // if memory empty (e.g., after hard refresh), rehydrate from storage
  if (!_authToken && typeof window !== 'undefined') {
    _authToken =
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('access_token') ||
      null
  }
  return _authToken
}

export function onUnauthorized(cb: (() => void) | null) {
  _onUnauthorized = cb
}

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  isFormData?: boolean
  signal?: AbortSignal
}

/** Core request helper */
async function request<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = toUrl(path)
  const headers: Record<string, string> = { ...(opts.headers || {}) }

  // JSON by default (unless uploading FormData)
  if (!opts.isFormData) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  }

  // Attach Authorization if we have a token
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
      credentials: 'include', // harmless if you don’t use cookies; required if you do
    })
  } catch (err: any) {
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

  // 204: no content to parse
  if (res.status === 204) return undefined as unknown as T

  return res.json() as Promise<T>
}

// Public helpers
export function getJSON<T>(path: string) {
  return request<T>(path, { method: 'GET' })
}

export function postJSON<T>(path: string, body: any) {
  return request<T>(path, { method: 'POST', body })
}

export function putJSON<T>(path: string, body: any) {
  return request<T>(path, { method: 'PUT', body })
}

export function patchJSON<T>(path: string, body: any) {
  return request<T>(path, { method: 'PATCH', body })
}

export function delJSON(path: string) {
  return request<void>(path, { method: 'DELETE' })
}

export async function uploadFile<T>(path: string, file: File) {
  const fd = new FormData()
  fd.append('file', file)
  return request<T>(path, { method: 'POST', body: fd, isFormData: true })
}
